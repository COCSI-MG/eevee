export async function stashResponse<RequestResult>(request: IDBRequest) {
  return new Promise<RequestResult>((resolve, reject) => {
    request.onerror = () => reject(new Error(request.error?.message));
    request.onsuccess = () => {
      console.log(request.result);
      resolve(request.result)
    };
  });
}
