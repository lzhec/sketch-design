import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { QuickToolEvent, Tool } from './toolbar.types';
import { SketchState } from '../sketch.state';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  @Output() public quickToolEvent = new EventEmitter<QuickToolEvent>();

  public Tool = Tool;

  constructor(private state: SketchState) {}

  public onToolClick(tool: Tool): void {
    this.state.currentTool$.next(tool);
  }

  public onFlipVerticalToolClick(): void {
    this.quickToolEvent.next({ tool: Tool.Flip, type: 'vertical' });
  }

  public onFlipHorizontalToolClick(): void {
    this.quickToolEvent.next({ tool: Tool.Flip, type: 'horizontal' });
  }
}
