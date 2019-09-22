/**
 * Class rút gọn các khai báo của thư viện SAT
 * Vector, box, circle, polygon 
 */
import SAT from "sat";

export function vec(x, y) {
  return new SAT.Vector(x, y);
}

export function pointToVec(p) {
  return new SAT.Vector(p.x, p.y);
}

export function box(pos, w, h) {
  return new SAT.Box(pos, w, h);
}

export function circle(pos, r) {
  return new SAT.Circle(pos, r);
}

export function polygon(pos, points) {
  return new SAT.Polygon(pos, points);
}
