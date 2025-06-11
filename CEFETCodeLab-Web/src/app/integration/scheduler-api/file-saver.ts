import { axiosClientWithAuth } from "./client";

export default class FileSaverService {
    static async uploadFileToServer(
        file: File,
        assignmentId: number,
        userId: number,
    ) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assignmentId', assignmentId.toString());
        formData.append('userId', userId.toString());
        formData.append('fileName', file.name);

        return await axiosClientWithAuth.post('file-saver', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        }) 
    }
}