import { Type } from 'class-transformer';
import {
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TranslatedTextDto } from '../translated-text.dto';

export class AddRecipeIngredientDto {
  @IsString()
  ingredientId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  instructions!: TranslatedTextDto;
}
