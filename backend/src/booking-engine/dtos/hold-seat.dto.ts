import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class HoldSeatDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 ghế' })
  @IsString({ each: true })
  seatCodes: string[]; // Ví dụ: ["A01", "A02"]

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, { message: 'Số điện thoại không hợp lệ' })
  customerPhone: string;
}
