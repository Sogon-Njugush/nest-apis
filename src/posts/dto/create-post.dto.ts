import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class createPostDto {
  @IsNotEmpty({ message: 'title is required' })
  @MinLength(3, { message: 'title must be at least 3 characters long' })
  @IsString({ message: 'title must be a string' })
  @MaxLength(50, { message: 'title must be at most 50 characters long' })
  title: string;
  @IsNotEmpty({ message: 'content is required' })
  @MinLength(3, { message: 'content must be at least 3 characters long' })
  @IsString({ message: 'content must be a string' })
  @MaxLength(1000, { message: 'content must be at most 1000 characters long' })
  content: string;
  @IsNotEmpty({ message: 'authorName is required' })
  @MinLength(3, { message: 'authorName must be at least 3 characters long' })
  @IsString({ message: 'authorName must be a string' })
  @MaxLength(50, { message: 'authorName must be at most 50 characters long' })
  authorName: string;
}
