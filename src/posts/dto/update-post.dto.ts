import { PartialType } from '@nestjs/mapped-types';
import { createPostDto } from './create-post.dto';
import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdatePostDto extends PartialType(createPostDto) {
  @IsNotEmpty({ message: 'id is required' })
  @IsInt({ message: 'id must be an integer' })
  id: number;
}
