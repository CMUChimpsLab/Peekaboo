export const logout = () => {
  return {
    type: "AUTH_LOGOUT",
    category: "auth"
  };
};

export const setUser = (user, token) => {
  return {
    type: "SET_USER",
    category: "auth",
    user,
    token
  }
}