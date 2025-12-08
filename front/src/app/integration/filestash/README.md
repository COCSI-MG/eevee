# FileStash - Integração com IndexedDB

Camada de integração simplificada para armazenamento local de árvores de arquivos usando IndexedDB.

## Estratégia: 1 Assignment = 1 Entry

Diferente de armazenar cada arquivo individualmente, guardamos a **árvore completa** de arquivos por assignment/usuário.

### Estrutura de Dados

```typescript
{
  id: "assignment-1-user-123",        // Chave única (keyPath)
  assignmentId: 1,
  userId: 123,
  fileTree: FileNode[],                // Árvore completa!
  updatedAt: "2025-10-23T..."
}
```

### Estrutura do FileNode

```typescript
{
  id: string;
  label: string;
  isSelectable: boolean;
  isFile: boolean;
  path: string;
  children?: FileNode[];               // Recursivo para pastas
  content?: string;                    // Apenas para arquivos (isFile: true)
  updatedAt?: string;
}
```

## Como Usar

### 1. Inicializar (automático)

```typescript
import { useFileStash } from "@/hooks/use-filestash";

// No componente raiz (já configurado no WorkspaceProvider)
useFileStash();
```

### 2. Salvar árvore completa (inicialização)

```typescript
import { useSaveFileTree } from "@/hooks/use-filestash";

const { mutate: saveFileTree } = useSaveFileTree();

// Salva toda a estrutura de uma vez
saveFileTree({
  assignmentId: 1,
  userId: 123,
  fileTree: [
    {
      id: "1",
      label: "src",
      isFile: false,
      path: "src",
      children: [
        {
          id: "2",
          label: "index.js",
          isFile: true,
          path: "src/index.js",
          content: "console.log('Hello');"
        }
      ]
    }
  ]
});
```

### 3. Atualizar conteúdo de um arquivo

```typescript
import { useUpdateFileContent } from "@/hooks/use-filestash";

const { mutate: updateFileContent } = useUpdateFileContent();

// Atualiza APENAS o conteúdo do arquivo específico
updateFileContent({
  assignmentId: 1,
  userId: 123,
  filePath: "src/index.js",
  content: "console.log('Updated!');"
});
// Internamente: busca a árvore, encontra o arquivo, atualiza e salva
```

### 4. Buscar conteúdo de um arquivo

```typescript
import { useFetchFileContent } from "@/hooks/use-filestash";

const { mutateAsync: fetchFileContent } = useFetchFileContent();

const content = await fetchFileContent({
  assignmentId: 1,
  userId: 123,
  filePath: "src/index.js"
});
// Retorna apenas o content: "console.log('Updated!');"
```

### 5. Buscar árvore completa (React Query)

```typescript
import { useFetchFileTree } from "@/hooks/use-filestash";

const { data: fileTree } = useFetchFileTree(assignmentId, userId);
// Retorna FileNode[] | null com a estrutura completa
```

## Funções de Baixo Nível

### `saveFileTree(assignmentId, userId, fileTree)`
Salva/substitui a árvore completa.

### `getFileTree(assignmentId, userId)`  
Retorna a árvore completa ou `null`.

### `updateFileContent(assignmentId, userId, filePath, content)`  
Busca a árvore, atualiza o arquivo específico recursivamente, e salva.

### `getFileContent(assignmentId, userId, filePath)`  
Busca recursivamente e retorna apenas o `content` do arquivo.

### `getAssignmentKey(assignmentId, userId)`  
Gera a chave: `"assignment-{assignmentId}-user-{userId}"`.

## Vantagens

✅ **Menos writes**: Atualiza árvore inteira ao invés de arquivo por arquivo  
✅ **Busca rápida**: Recursão em memória após carregar a árvore  
✅ **Estrutura mantida**: Preserva hierarquia de pastas e arquivos  
✅ **Simples de debugar**: Você vê toda a estrutura de uma vez no IndexedDB  
✅ **Type-safe**: TypeScript em toda a pilha  

## Fluxo de Dados

```
1. Carregar assignment → saveFileTree() → IndexedDB
2. Selecionar arquivo  → fetchFileContent() → Renderiza editor
3. Editar código       → updateFileContent() → Atualiza árvore → IndexedDB
4. Submeter tarefa     → fetchFileContent() → Envia para servidor
```

## Performance

- **Read**: O(n) onde n = número total de arquivos na árvore
- **Write**: O(n) sempre salva a árvore completa
- **Storage**: 1 entry por assignment/usuário (não por arquivo!)

Ideal para projetos com até ~100 arquivos por assignment.
