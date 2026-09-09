import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { TranslatedTextDto } from '../translated-text.dto';

export class UpdateRecipeIngredientDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  instructions?: TranslatedTextDto;
}
