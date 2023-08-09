import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { MenuEvent } from './menu.types';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  @Output() public addFileEvent = new EventEmitter<MenuEvent>();

  public readonly acceptFileFormats = '.png, .jpg, .jpe, .jpeg';

  constructor() {}

  public selectFile(event: Event): void {
    const file = (<HTMLInputElement>event.currentTarget)?.files[0];

    if (file) {
      this.addFileEvent.next({ event: 'add', entity: file });
    }
  }

  public downloadEventHandler(): void {
    this.fileInput.nativeElement.value = null;
  }
}
