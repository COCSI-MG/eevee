export type WorkerFilesNode = {
    id: string,
    children: Array<WorkerFilesNode> | null,
    type: 'file' | 'folder',
    content?: string,
}

export type WorkerDefinition = {
    files: WorkerFilesNode | null,
    startCommands: string[],
    testCommands: string[],
    dependencies: string[],
}