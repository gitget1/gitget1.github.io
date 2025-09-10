import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TourProgram } from './tour-program.entity';
import { ColumnNumericTransformer } from 'src/@common/transformers/numeric.transformer';

@Entity()
export class TourProgramSchedule extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  day: number;

  @Column()
  scheduleSequence: number;

  @Column()
  placeId: string;

  @Column()
  placeName: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    transformer: new ColumnNumericTransformer(),
  })
  lat: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    transformer: new ColumnNumericTransformer(),
  })
  lon: number;

  @Column('text')
  placeDescription: string;

  @Column()
  travelTime: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => TourProgram, (tourProgram) => tourProgram.schedules, {
    onDelete: 'CASCADE',
  })
  tourProgram: TourProgram;
}
