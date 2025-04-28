import { object, string } from "yup";

export const loginSchema = object({
  email: string()
    .email("Invalid email format")
    .required("Please enter your email"),
  password: string().required("Please enter your password"),
});

export const signUpSchema = object({
  name: string().required("Please enter your name"),
  phone: string()
    .matches(
      /(\+84|84|0[3|5|7|8|9])+([0-9]{8})\b/g,
      "Phone number must be a Vietnamese phone number.\n Ex: 0828696919 or +84828696919"
    )
    .required("Please enter your phone number"),
  email: string()
    .email("Invalid email format")
    .required("Please enter your email"),
  password: string()
    .min(6, "Password must have at least 6 characters")
    .required("Please enter your password"),
});
