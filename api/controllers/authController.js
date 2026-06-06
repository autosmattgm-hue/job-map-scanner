import { AuthService } from "../services/authService.js";

const authService = new AuthService();

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req, res) {
  res.json({ user: req.user });
}
