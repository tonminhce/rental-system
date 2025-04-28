"use client";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import useRedirectBack from "@/hooks/useRedirectBack";
import { useSignupMutation } from "@/redux/features/auth/authApiSlice";
import { setUserInfo } from "@/redux/features/auth/authSlice";
import { signUpSchema } from "@/schemas/authentication";
import clsx from "clsx";
import { ErrorMessage, Field, Formik, Form } from "formik";
import Link from "next/link";
import { Suspense } from "react";
import { useDispatch } from "react-redux";

export default function SignUpPage() {
  const dispatch = useDispatch();
  const [signup] = useSignupMutation();
  const redirect = useRedirectBack();

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const response = await signup(values).unwrap();
      setSubmitting(false);
      dispatch(setUserInfo(response.data));
      redirect();
    } catch (error) {
      console.log(error);
      setFieldError("password", error.data.message);
    }
  };

  return (
    <Suspense>
      <div className="auth_form-container">
        <Formik
          initialValues={{ name: "", phone: "", email: "", password: "" }}
          onSubmit={handleSubmit}
          validationSchema={signUpSchema}
          validateOnChange={false}
          validateOnMount={false}
        >
          {({ isSubmitting, errors }) => (
            <Form className="auth_form">
              <Field
                className={clsx("auth_form-input", errors.name && "auth_form-input--error")}
                name="name"
                placeholder="Enter your name*"
              />
              <ErrorMessage className="auth_form-message auth_form-message--error" name="name" component="p" />
              <Field
                className={clsx("auth_form-input", errors.phone && "auth_form-input--error")}
                name="phone"
                placeholder="Phone Number*"
              />
              <ErrorMessage className="auth_form-message auth_form-message--error" name="phone" component="p" />
              <Field
                className={clsx("auth_form-input", errors.email && "auth_form-input--error")}
                name="email"
                placeholder="Email*"
              />
              <ErrorMessage className="auth_form-message auth_form-message--error" name="email" component="p" />
              <Field
                className={clsx("auth_form-input", errors.password && "auth_form-input--error")}
                type="password"
                name="password"
                placeholder="Password*"
              />
              <ErrorMessage className="auth_form-message auth_form-message--error" name="password" component="p" />
              <AuthSubmitButton loading={isSubmitting}>Sign Up</AuthSubmitButton>
            </Form>
          )}
        </Formik>
        <p>
          Already have an account <Link href="/login">Login</Link>
        </p>
      </div>
    </Suspense>
  );
}
