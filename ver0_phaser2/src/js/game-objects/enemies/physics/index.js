// Wrapper around custom SAT exporter from Physics Editor
// - Only supports first shape defined in Physics Editor
// - First shape must be a polygon

// Transformation applied:
//
// "beetle": {
//   "width": "50",
//   "height": "75",
//   "shapes": [
//     {
//       "type": "POLYGON",
//       "hull": [ [13, 16], ... ],
//       "polygons": [ ... ]
//     }
//   ]
// }
//
// 1. Extract first shape for each
// 2. Grab the hull
// 3. Normalize the hull points
//
// ->
//
// "beetle": [ [0.1, 0.12], ... ]

import physics from "./enemies.json";

/**
 * Thông tin về polygon chứa hình dạng vật lý của các loại enemy 
 */
const formattedPhysics = {};

for (const enemyName in physics) {
  // chiều rộng của enemy 
  const width = parseInt(physics[enemyName].width, 10);
  // chiều cao của enemy 
  const height = parseInt(physics[enemyName].height, 10);
  // vỏ bọc của enemy 
  const hull = physics[enemyName].shapes[0].hull;
  // convert về tỉ lệ 0-1 
  formattedPhysics[enemyName] = hull.map(p => [p[0] / width, p[1] / height]);
}

export default formattedPhysics;
