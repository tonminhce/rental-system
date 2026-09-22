"use client";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import useRedirectBack from "@/hooks/useRedirectBack";
import { useSignupMutation } from "@/redux/features/auth/authApiSlice";
import { loginSuccess } from "@/redux/features/auth/authSlice";
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

      dispatch(loginSuccess(response.data));
      redirect();
    } catch (error) {
      setFieldError("password", error?.data?.message || "We couldn’t create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Suspense>
      <div className="auth_form-container animate-fade-in-up">
        <div className="auth_intro">
          <span>FIND A PLACE. MAKE IT YOURS.</span>
          <h1>Start your next chapter.</h1>
          <p>Create an account to save homes or list your property.</p>
        </div>
        <Formik
          initialValues={{ name: "", phone: "", email: "", password: "", role: "user" }}
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
                aria-label="Full name"
                autoComplete="name"
                placeholder="Enter your name*"
              />
              <ErrorMessage className="auth_form-message auth_form-message--error" name="name" component="p" />
              <Field
                className={clsx("auth_form-input", errors.phone && "auth_form-input--error")}
                name="phone"
                type="tel"
                aria-label="Phone number"
                autoComplete="tel"
                placeholder="Phone Number*"
              />
              <ErrorMessage className="auth_form-message auth_form-message--error" name="phone" component="p" />
              <Field
                className={clsx("auth_form-input", errors.email && "auth_form-input--error")}
                name="email"
                type="email"
                aria-label="Email address"
                autoComplete="email"
                placeholder="Email*"
              />
              <ErrorMessage className="auth_form-message auth_form-message--error" name="email" component="p" />
              <Field
                className={clsx("auth_form-input", errors.password && "auth_form-input--error")}
                type="password"
                name="password"
                aria-label="Password"
                autoComplete="new-password"
                placeholder="Password*"
              />
              <ErrorMessage className="auth_form-message auth_form-message--error" name="password" component="p" />
              <Field as="select" name="role" aria-label="Account type" className="auth_form-input">
                <option value="user">I’m looking for a home</option>
                <option value="rental">I’m a property owner</option>
              </Field>
              <AuthSubmitButton loading={isSubmitting}>Sign Up</AuthSubmitButton>
            </Form>
          )}
        </Formik>
        <Link href="/login" className="auth_signup-link">
          Already have an account? Log in →
        </Link>
      </div>
    </Suspense>
  );
}
