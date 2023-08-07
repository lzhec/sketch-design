import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { ToolbarEvent } from './toolbar.types';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent {
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  @Output() public toolbarEvent = new EventEmitter<ToolbarEvent>();

  public readonly acceptFileFormats = '.png, .jpg, .jpe, .jpeg';

  constructor(private cd: ChangeDetectorRef) {}

  public selectFile(event: Event): void {
    const file = (<HTMLInputElement>event.currentTarget)?.files[0];

    if (file) {
      this.toolbarEvent.next({ event: 'add', entity: file });
    }
  }

  public downloadEventHandler(): void {
    this.fileInput.nativeElement.value = null;
  }
}
