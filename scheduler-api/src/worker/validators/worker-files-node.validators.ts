import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { WorkerFilesNodeDto } from '../dto/worker-definition.dto';

@ValidatorConstraint({ name: 'maxDepth', async: false })
export class MaxDepthConstraint implements ValidatorConstraintInterface {
  validate(node: WorkerFilesNodeDto, args: ValidationArguments): boolean {
    const maxDepth = args.constraints[0] || 5;
    return this.checkDepth(node, 1, maxDepth);
  }

  private checkDepth(
    node: WorkerFilesNodeDto,
    currentDepth: number,
    maxDepth: number,
  ): boolean {
    if (currentDepth > maxDepth) {
      return false;
    }

    if (node.children && node.children.length > 0) {
      return node.children.every((child) =>
        this.checkDepth(child, currentDepth + 1, maxDepth),
      );
    }

    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `File structure exceeds maximum depth of ${validationArguments?.constraints[0] || 5}`;
  }
}

@ValidatorConstraint({ name: 'maxFiles', async: false })
export class MaxFilesConstraint implements ValidatorConstraintInterface {
  validate(node: WorkerFilesNodeDto, args: ValidationArguments): boolean {
    const maxFiles = args.constraints[0] || 50;
    const fileCount = this.countFiles(node);
    return fileCount <= maxFiles;
  }

  private countFiles(node: WorkerFilesNodeDto): number {
    if (node.type === 'file') {
      return 1;
    }

    let count = 0;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        count += this.countFiles(child);
      }
    }

    return count;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `File structure exceeds maximum number of files: ${validationArguments?.constraints[0] || 50}`;
  }
}
