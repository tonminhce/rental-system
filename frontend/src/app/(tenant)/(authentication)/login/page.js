"use client";
import Link from "next/link";
import AuthSubmitButton from "@/components/AuthSubmitButton";
import useRedirectBack from "@/hooks/useRedirectBack";
import { useLoginMutation } from "@/redux/features/auth/authApiSlice";
import { loginSuccess, setUserInfo } from "@/redux/features/auth/authSlice";
import "@scss/authentication.scss";
import clsx from "clsx";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useDispatch } from "react-redux";
import { loginSchema } from "@/schemas/authentication";

function LoginPage() {
  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  const redirect = useRedirectBack();

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const response = await login(values).unwrap();
      setSubmitting(false);
      
      dispatch(loginSuccess(response.data));
      redirect();
    } catch (error) {
      console.log(error);
      setFieldError("password", error.data.message);
    }
  };

  return (
    <div className="auth_form-container">
      <Formik
        initialValues={{ phone: "", password: "" }}
        validationSchema={loginSchema}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors }) => (
          <Form className="auth_form">
            <Field
              className={clsx("auth_form-input", errors.email && "auth_form-input--error")}
              type="email"
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
            <AuthSubmitButton loading={isSubmitting}>Login</AuthSubmitButton>
          </Form>
        )}
      </Formik>
      <Link href="/signup">
        <button className="btn btn-default-success btn-xl">Create new account</button>
      </Link>
    </div>
  );
}

export default LoginPage;
