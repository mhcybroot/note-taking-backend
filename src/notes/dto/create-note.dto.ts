import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'My First Secure Note', description: 'Title of the note' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  title: string;

  @ApiProperty({
    example: 'Confidential personal notes and thoughts.',
    description: 'Note content',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content: string;
}
