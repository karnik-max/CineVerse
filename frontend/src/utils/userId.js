export function getOrCreateUserId() {
  let userId = localStorage.getItem("cineverse_user_id");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
    localStorage.setItem("cineverse_user_id", userId);
  }
  return userId;
}
