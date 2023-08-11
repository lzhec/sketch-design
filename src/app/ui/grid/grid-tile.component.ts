import {
  Component,
  ViewEncapsulation,
  ElementRef,
  Renderer2,
  Attribute,
  ChangeDetectionStrategy,
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { GridComponent } from './grid.component';
import { TilePadding } from './grid.types';
import { toTilePadding } from './grid.helper';

export type AlignType = 'center' | 'left' | 'right' | 'top' | 'bottom';
export type DisplayType = 'row' | 'column';

@Component({
  selector: 'app-grid-tile',
  template: '<ng-content></ng-content>',
  styleUrls: ['./grid-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-grid-tile',
    '[style.--colspan]': 'colspan',
  },
})
export class GridTileComponent implements OnChanges {
  /**
   * показывать или нет выступающие за границу тайла элементы
   */
  @Input() public showOverflow: boolean = false;

  @HostBinding('style.overflow')
  public get overflowStyle(): 'hidden' | 'visible' {
    return this.showOverflow ? 'visible' : 'hidden';
  }

  /** число столбцов, которые занимает ячейка */
  @Input() public colspan: number = 1;

  /** флаг ячейки с пустым контентом.
   * иногда нужно отображать заглушку вместо контента
   */
  @Input() public blank: boolean = false;

  private _selfPadding: TilePadding;

  constructor(
    /** выравнивание контента ячейки по горизонтали и вертикале */
    @Attribute('contentAlign') public contentAlign: string = null,
    /** направление рисования контента ячейки */
    @Attribute('display') public contentDisplay: DisplayType = null,
    /** собственный размер паддинга внутри ячейки сетки */
    @Attribute('selfPadding') public selfPadding: string = null,
    private el: ElementRef,
    private r: Renderer2,
    private grid: GridComponent,
  ) {
    this.colspan = this.colspan || 1;
    this.contentAlign = this.contentAlign || 'left top';
    this.contentDisplay = this.contentDisplay || 'column';
    this._selfPadding = this.selfPadding
      ? toTilePadding(this.selfPadding)
      : null;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['colspan'] &&
      changes['colspan'].previousValue &&
      changes['colspan'].previousValue !== changes['colspan'].currentValue
    ) {
      this.grid.setGridItemsStyles();
    }
  }

  /**
   * Динамически устанавливает размеры ячейки сетки.
   * @param rowHeight высота строки сетки
   * @param tilePadding размер паддинга внутри ячейки сетки
   */
  public setStyles(rowHeight: number, tilePadding: TilePadding): void {
    if (rowHeight) {
      this.r.setStyle(this.el.nativeElement, 'max-height', `${rowHeight}px`);
      this.r.setStyle(this.el.nativeElement, 'min-height', `${rowHeight}px`);
    }

    const _tilePadding: TilePadding = this._selfPadding
      ? this._selfPadding
      : tilePadding;

    if (_tilePadding.top) {
      this.r.setStyle(
        this.el.nativeElement,
        'padding-top',
        `${_tilePadding.top}px`,
      );
    }

    if (_tilePadding.bottom) {
      this.r.setStyle(
        this.el.nativeElement,
        'padding-bottom',
        `${_tilePadding.bottom}px`,
      );
    }

    if (_tilePadding.left) {
      this.r.setStyle(
        this.el.nativeElement,
        'padding-left',
        `${_tilePadding.left}px`,
      );
    }

    if (_tilePadding.right) {
      this.r.setStyle(
        this.el.nativeElement,
        'padding-right',
        `${_tilePadding.right}px`,
      );
    }

    this.setContentDisplay();
    this.setContentAlign();
  }

  /**
   * Задает правило рисования контента ячейки.
   */
  private setContentDisplay(): void {
    switch (this.contentDisplay) {
      case 'row':
        this.r.setStyle(this.el.nativeElement, 'flex-direction', 'row');
        break;

      case 'column':
        this.r.setStyle(this.el.nativeElement, 'flex-direction', 'column');
        break;

      default:
        throw new Error('Error: app-grid-tile input "display" incorrect value');
    }
  }

  /**
   * Выравнивает контент ячейки.
   */
  private setContentAlign(): void {
    const contentAlign = this.contentAlign.trim();

    if (!contentAlign.length) {
      throw new Error(
        'Error: app-grid-tile input "contentAlign" should not be empty',
      );
    }

    const aligns = contentAlign.split(' ').map((align) => align.trim());

    if (aligns.length > 2) {
      throw new Error(
        'Error: app-grid-tile input "contentAlign" incorrect value',
      );
    }

    let horizontalAlign: AlignType;

    switch (aligns[0]) {
      case 'left':
      case 'right':
      case 'center':
        horizontalAlign = aligns[0] as AlignType;
        break;

      default:
        throw new Error(
          'Error: app-grid-tile input "contentAlign" incorrect horizontal value',
        );
    }

    let verticalAlign: AlignType;

    if (aligns[1]) {
      switch (aligns[1]) {
        case 'top':
        case 'bottom':
        case 'center':
          verticalAlign = aligns[1] as AlignType;
          break;

        default:
          throw new Error(
            'Error: app-grid-tile input "contentAlign" incorrect vertical value',
          );
      }
    } else {
      verticalAlign = 'top';
    }

    switch (this.contentDisplay) {
      case 'row': {
        switch (horizontalAlign) {
          case 'left':
            this.r.setStyle(
              this.el.nativeElement,
              'justify-content',
              'flex-start',
            );
            break;
          case 'right':
            this.r.setStyle(
              this.el.nativeElement,
              'justify-content',
              'flex-end',
            );
            break;
          case 'center':
            this.r.setStyle(this.el.nativeElement, 'justify-content', 'center');
            break;
        }

        switch (verticalAlign) {
          case 'top':
            this.r.setStyle(this.el.nativeElement, 'align-items', 'flex-start');
            break;
          case 'bottom':
            this.r.setStyle(this.el.nativeElement, 'align-items', 'flex-end');
            break;
          case 'center':
            this.r.setStyle(this.el.nativeElement, 'align-items', 'center');
            break;
        }

        break;
      }

      case 'column': {
        switch (horizontalAlign) {
          case 'left':
            this.r.setStyle(this.el.nativeElement, 'align-items', 'flex-start');
            break;
          case 'right':
            this.r.setStyle(this.el.nativeElement, 'align-items', 'flex-end');
            break;
          case 'center':
            this.r.setStyle(this.el.nativeElement, 'align-items', 'center');
            break;
        }

        switch (verticalAlign) {
          case 'top':
            this.r.setStyle(
              this.el.nativeElement,
              'justify-content',
              'flex-start',
            );
            break;
          case 'bottom':
            this.r.setStyle(
              this.el.nativeElement,
              'justify-content',
              'flex-end',
            );
            break;
          case 'center':
            this.r.setStyle(this.el.nativeElement, 'justify-content', 'center');
            break;
        }

        break;
      }
    }
  }
}
