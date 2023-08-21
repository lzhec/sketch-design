export const utils = {
  calcIncircle(A, B, C) {
    function lineLen(p1, p2) {
      const dx = p2[0] - p1[0],
        dy = p2[1] - p1[1];
      return Math.sqrt(dx * dx + dy * dy);
    }

    const a = lineLen(B, C),
      b = lineLen(C, A),
      c = lineLen(A, B),
      p = a + b + c,
      s = p / 2;

    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

    const r = area / s,
      cx = (a * A[0] + b * B[0] + c * C[0]) / p,
      cy = (a * A[1] + b * B[1] + c * C[1]) / p;
    return {
      r,
      c: [cx, cy],
    };
  },

  expandTriangle(A, B, C, amount) {
    const incircle = this.calcIncircle(A, B, C),
      c = incircle.c,
      factor = (incircle.r + amount) / incircle.r;

    function extendPoint(p) {
      const dx = p[0] - c[0],
        dy = p[1] - c[1],
        x2 = dx * factor + c[0],
        y2 = dy * factor + c[1];
      return [x2, y2];
    }

    const A2 = extendPoint(A),
      B2 = extendPoint(B),
      C2 = extendPoint(C);
    return [A2, B2, C2];
  },

  linearSolution(r1, s1, t1, r2, s2, t2, r3, s3, t3) {
    var a =
      ((t2 - t3) * (s1 - s2) - (t1 - t2) * (s2 - s3)) /
      ((r2 - r3) * (s1 - s2) - (r1 - r2) * (s2 - s3));
    var b =
      ((t2 - t3) * (r1 - r2) - (t1 - t2) * (r2 - r3)) /
      ((s2 - s3) * (r1 - r2) - (s1 - s2) * (r2 - r3));
    var c = t1 - r1 * a - s1 * b;

    return [a, b, c];
  },

  drawImageTriangle(img, ctx, s1, s2, s3, d1, d2, d3) {
    //I assume the "m" is for "magic"...
    const xm = this.linearSolution(
        s1[0],
        s1[1],
        d1[0],
        s2[0],
        s2[1],
        d2[0],
        s3[0],
        s3[1],
        d3[0],
      ),
      ym = this.linearSolution(
        s1[0],
        s1[1],
        d1[1],
        s2[0],
        s2[1],
        d2[1],
        s3[0],
        s3[1],
        d3[1],
      );

    ctx.save();

    ctx.setTransform(xm[0], ym[0], xm[1], ym[1], xm[2], ym[2]);
    ctx.beginPath();
    ctx.moveTo(s1[0], s1[1]);
    ctx.lineTo(s2[0], s2[1]);
    ctx.lineTo(s3[0], s3[1]);
    ctx.closePath();

    ctx.clip();
    ctx.drawImage(img, 0, 0, img.width, img.height);

    ctx.restore();

    return;
  },
};
