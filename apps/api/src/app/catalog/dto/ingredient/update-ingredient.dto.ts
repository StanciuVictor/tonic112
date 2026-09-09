import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TranslatedTextDto } from '../translated-text.dto';

export class UpdateIngredientDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  name?: TranslatedTextDto;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  unit?: string;
}
