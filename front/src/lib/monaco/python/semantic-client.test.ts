import { applyPythonSemantic, disposePythonSemantic } from './semantic-client';

type Monaco = typeof import('monaco-editor');
type Model = import('monaco-editor').editor.ITextModel;
type Position = import('monaco-editor').Position;
type CompletionResult = { suggestions: Array<Record<string, unknown>> };
type HoverResult = { contents: Array<{ value: string }> } | null;
type SignatureResult = {
 value: { signatures: Array<{ parameters: Array<{ label: string }> }> };
} | null;
type Provider = {
 provideCompletionItems?: (model: Model, position: Position) => Promise<CompletionResult>;
 provideHover?: (model: Model, position: Position) => Promise<HoverResult>;
 provideSignatureHelp?: (model: Model, position: Position) => Promise<SignatureResult>;
};

class FakeWorker {
 static instance: FakeWorker;
 postMessage=jest.fn(); terminate=jest.fn(); onmessage?: (event: {data: unknown})=>void;
 constructor(){ FakeWorker.instance=this; }
}
const providers: Partial<Record<'complete' | 'hover' | 'signature', Provider>>={};
const disposable=()=>({dispose:jest.fn()});
const monaco={languages:{CompletionItemKind:{Method:1,Variable:2},
 registerCompletionItemProvider:jest.fn((_: string,p:Provider)=>{providers.complete=p;return disposable();}),
 registerHoverProvider:jest.fn((_: string,p:Provider)=>{providers.hover=p;return disposable();}),
 registerSignatureHelpProvider:jest.fn((_: string,p:Provider)=>{providers.signature=p;return disposable();})}} as unknown as Monaco;
let version=1;
const model={isDisposed:()=>false,getLanguageId:()=> 'python', getVersionId:()=>version,getValue:()=> 'df.',getValueLength:()=>3,getLineContent:()=> 'df.', getWordUntilPosition:()=>({startColumn:4,endColumn:4})} as unknown as Model;
const position={lineNumber:1,column:4} as unknown as Position;
const respond=(result:unknown)=>{const w=FakeWorker.instance;const [{id}]=w.postMessage.mock.calls.at(-1) as [{id:number}];w.onmessage?.({data:{id,result}});};
beforeEach(()=>{global.Worker=FakeWorker as unknown as typeof Worker;version=1;jest.clearAllMocks();applyPythonSemantic(monaco,[model]);});
afterEach(()=>disposePythonSemantic());
it('registers Python completion, hover and signature providers with typed results',async()=>{
 const completion=providers.complete!.provideCompletionItems!(model,position);respond([{label:'head',kind:'function',detail:'def head'}]);
 expect((await completion).suggestions[0]).toMatchObject({label:'head',kind:1,detail:'def head'});
 const hover=providers.hover!.provideHover!(model,position);respond([{label:'DataFrame',detail:'instance DataFrame'}]);expect((await hover)!.contents[0].value).toBe('instance DataFrame');
 const signature=providers.signature!.provideSignatureHelp!(model,position);respond([{label:'head(n: int=5) -> Self',parameters:['n: int=5'],activeParameter:0}]);expect((await signature)!.value.signatures[0].parameters[0].label).toBe('n: int=5');
});
it('discards stale results and refuses models outside the workspace',async()=>{
 const result=providers.complete!.provideCompletionItems!(model,position);version++;respond([{label:'head'}]);expect((await result).suggestions).toEqual([]);
 const other={...model} as Model;expect((await providers.complete!.provideCompletionItems!(other,position)).suggestions).toEqual([]);
});
it('settles pending requests and terminates only its own worker on dispose',async()=>{
 const result=providers.hover!.provideHover!(model,position);const worker=FakeWorker.instance;disposePythonSemantic();expect(await result).toBeNull();expect(worker.terminate).toHaveBeenCalledTimes(1);
});

it('recovers from failed bootstrap with cooldown and a fresh worker',async()=>{
 const now=jest.spyOn(Date,'now').mockReturnValue(1000);
 try {
  const failed=providers.complete!.provideCompletionItems!(model,position);
  const first=FakeWorker.instance;
  const [{id}]=first.postMessage.mock.calls.at(-1) as [{id:number}];
  first.onmessage?.({data:{id,bootstrapFailed:true,error:'temporary asset failure'}});
  expect((await failed).suggestions).toEqual([]);
  expect(first.terminate).toHaveBeenCalledTimes(1);
  expect((await providers.complete!.provideCompletionItems!(model,position)).suggestions).toEqual([]);
  expect(FakeWorker.instance).toBe(first);
  now.mockReturnValue(6001);
  const recovered=providers.complete!.provideCompletionItems!(model,position);
  expect(FakeWorker.instance).not.toBe(first);
  respond([{label:'head',kind:'function',detail:'def head'}]);
  expect((await recovered).suggestions[0].label).toBe('head');
 } finally { now.mockRestore(); }
});
