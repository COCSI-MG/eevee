import { promisify } from "node:util";
import { exec as cpExec } from "node:child_process";

export const exec = promisify(cpExec);