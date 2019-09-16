export default {
  SCATTERSHOT: "SCATTERSHOT", // đạn tỏa chùm 
  RAPID_FIRE: "RAPID_FIRE", // đạn liên thanh 
  PIERCING_SHOT: "PIERCING_SHOT", // đạn xuyên giáp 
  HOMING_SHOT: "HOMING_SHOT", // đạn đuổi 
  ROCKET_LAUNCHER: "ROCKET_LAUNCHER", // đạn rocket 
  FLAMETHROWER: "FLAMETHROWER", // đạn lửa 
  BOUNCING: "BOUNCING" // đạn nảy tường 
};

export function getFormattedType(type) {
  return type
    .toLowerCase()
    .split("_")
    .map(word => word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");
}
