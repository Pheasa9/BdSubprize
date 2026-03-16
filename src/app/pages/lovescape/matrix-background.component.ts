import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-matrix-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matrix-background.component.html',
  styleUrls: ['./matrix-background.component.scss']
})
export class MatrixBackgroundComponent {
  columns = Array.from({ length: 20 }, (_, i) => this.createColumn(i));
  static glyphSet = 'HAPPYBIRTHDAYTOSOKYA❤★✦ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  static randomGlyph() {
    const set = MatrixBackgroundComponent.glyphSet;
    return set[Math.floor(Math.random() * set.length)];
  }

  createColumn(i: number) {
    return {
      id: i,
      left: `calc(${(i + 0.5) * 5}% - 2vw)`,
      duration: 2.5 + Math.random() * 2.5,
      delay: Math.random() * 2.5,
      glyphs: Array.from({ length: 60 }, () => MatrixBackgroundComponent.randomGlyph()),
      animating: true
    };
  }

  onAnimationDone(colIdx: number) {
    // Regenerate glyphs and retrigger animation for this column
    this.columns[colIdx] = this.createColumn(colIdx);
  }
}
