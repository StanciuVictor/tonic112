import { IsString, MaxLength, MinLength } from 'class-validator';

export class TranslatedTextDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  en!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  ro!: string;
}
