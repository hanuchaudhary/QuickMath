let USERNAMES = [
  "John",
  "Jane",
  "Jim",
  "Jill",
  "Jack",
  "Jill",
  "Jack",
  "Jill",
  "Jack",
  "Jill",
  "Jack",
];

export const getRandomUsername = () => {
  return USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
};
