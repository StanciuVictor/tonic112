import { Type } from 'class-transformer';
import {
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TranslatedTextDto } from '../translated-text.dto';

export class CreateIngredientDto {
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  name!: TranslatedTextDto;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  unit!: string;
}
