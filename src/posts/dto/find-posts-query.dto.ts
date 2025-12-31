import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class FindPostsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  @MaxLength(100, { message: 'title must be at most 50 characters long' })
  title?: string;
}
