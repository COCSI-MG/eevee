import { axiosClientWithAuth } from "./client";

export default class FileSaverService {
    static async uploadFileToServer(
        file: File,
        assignmentId: number,
    ) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assignmentId', assignmentId.toString());
        formData.append('fileName', file.name);

        return await axiosClientWithAuth.post('file-saver', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
    }
}