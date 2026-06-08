import { IsInt, IsISO8601, IsNotEmpty, IsString, Min } from 'class-validator';

export class ScheduleSessionRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsISO8601()
  startsAt!: string;

  @IsInt()
  @Min(1)
  capacity!: number;
}
