import { IsString, MaxLength, MinLength } from 'class-validator';

export class JoinGuestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  guestName!: string;
}
