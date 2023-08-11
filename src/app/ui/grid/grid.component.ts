import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Attribute,
  ContentChildren,
  QueryList,
  AfterContentInit,
  HostBinding,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { GridTileComponent } from './grid-tile.component';
import { BaseObject } from '@shared/base/base-object';
import { GapType } from './grid.types';
import { toNumber, toTilePadding } from './grid.helper';

@Component({
  selector: 'app-grid',
  template: `<div class="app-grid__body">
    <ng-content select="app-grid-tile"></ng-content>
  </div>`,
  styleUrls: ['./grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-grid',
    '[class.--breakpoints-enable]': 'breakpointsEnable',
    '[style.--gap]': 'gap',
    '[style.--cols]': 'cols',
  },
})
export class GridComponent
  extends BaseObject
  implements AfterContentInit, OnChanges
{
  /** число столбцов сетки */
  @Input() public cols: number = 1;

  /** размер набивки между ячейками сетки */
  @Input() public gap: string = null;

  /** тип набивки между ячейками сетки */
  @Input()
  public set gapType(value: GapType) {
    this._gapType = value;
  }

  public get gapType(): GapType {
    return this._gapType;
  }

  @HostBinding('class')
  public get gapTypeClass(): string {
    return `--${this.gapType}-gap`;
  }

  /** флаг для адаптивности сетки  */
  @Input() public breakpointsEnable = true;

  /** список элементов сетки из проекции контента */
  @ContentChildren(GridTileComponent)
  private tiles: QueryList<GridTileComponent>;

  private _gapType: GapType = 'inner';

  constructor(
    /** высота строки сетки */
    @Attribute('rowHeight') public rowHeight: string = null,
    /** размер паддинга внутри ячейки сетки */
    @Attribute('tilePadding') public tilePadding: string = null,
    public el: ElementRef<HTMLElement>,
  ) {
    super();
  }

  public ngAfterContentInit(): void {
    this.setGridItemsStyles();

    this.tiles.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.setGridItemsStyles());
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['cols'] &&
      changes['cols'].previousValue &&
      changes['cols'].previousValue !== changes['cols'].currentValue
    ) {
      if (!this.cols) {
        throw new Error('Error: app-grid input "cols" should be set');
      }

      this.setGridItemsStyles();
    }

    if (
      changes['breakpointsEnable'] &&
      (changes['breakpointsEnable'].currentValue === undefined ||
        changes['breakpointsEnable'].currentValue === null)
    ) {
      this.breakpointsEnable = true;
    }
  }

  /**
   * Динамически устанавливает размеры ячеек
   */
  public setGridItemsStyles(): void {
    this.tiles.forEach((tile: GridTileComponent) =>
      tile.setStyles(toNumber(this.rowHeight), toTilePadding(this.tilePadding)),
    );
  }
}
