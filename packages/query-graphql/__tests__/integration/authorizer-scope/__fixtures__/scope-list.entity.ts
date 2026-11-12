// eslint-disable-next-line import/no-extraneous-dependencies
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { ScopeItem } from './scope-item.entity'

@Entity('scope_list')
export class ScopeList {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @OneToMany(() => ScopeItem, (item) => item.list)
  items: ScopeItem[]
}
