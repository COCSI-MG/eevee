export type FileStrucutre = {
  name: string;
  data: Blob | string | File;
  size: number;
  createdAt: string | Date;
  updateAt: string | Date;
};

export type PublicFileSchema = {
  files: {
    Key: string;
    Schema: FileStrucutre;
    Indexes: {
      Name: [string];
    };
  };
};

export type StoreStashSchema = {
  Key: IDBValidKey;
  Schema: FileStrucutre & Record<string, unknown>;
  Indexes: Record<string, IDBValidKey[]>;
};

export type FileStashSchema = Record<string, StoreStashSchema>;
