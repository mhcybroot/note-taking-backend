import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'MongoDB Aggregations Deep Dive', description: 'Title of the post' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @ApiProperty({
    example: 'Exploring $lookup and $group stages in MongoDB 7.',
    description: 'Post content',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content: string;
}
