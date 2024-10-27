import React, { useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  FormGroup,
  FormLabel,
  FormText,
} from "react-bootstrap";
import { confirmUserAttribute, updateUserAttributes } from "aws-amplify/auth";
import LoaderButton from "../../components/LoaderButton";

import "./VerifyEmail.css";
import { LinkContainer } from "react-router-bootstrap";

const VerifyEmail = ({ handleCloseEmailVerifyModal }) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isErrorState, setIsErrorState] = useState(false);
  const [isSuccessState, setIsSuccessState] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await confirmUserAttribute({
        userAttributeKey: "email",
        confirmationCode: code,
      });
      await updateUserAttributes({
        userAttributes: {
          "custom:email_valid": "true",
        },
      });
      setIsErrorState(false);
      setIsSuccessState(true);
    } catch (e) {
      setIsErrorState(true);
      setErrorMessage(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = () => {
    if (isErrorState) {
      return (
        <Alert
          variant="danger"
          onClose={() => setIsErrorState(false)}
          dismissible
        >
          {errorMessage}
        </Alert>
      );
    }
  };

  const validateForm = () => !!code;

  return (
    <div className="VerifyEmail">
      {renderError()}
      {isSuccessState ? (
        <>
          <Alert variant="success">Email Verified!</Alert>
          <p>
            If you haven't already,{" "}
            <LinkContainer to="/forgot-password">
              <a href="#/">click here</a>
            </LinkContainer>{" "}
            to set a new password.
          </p>
          <Button block onClick={handleCloseEmailVerifyModal}>
            Close
          </Button>
        </>
      ) : (
        <form onSubmit={(e) => handleSubmit(e)}>
          <FormGroup controlId="code">
            <FormLabel>Verification Code</FormLabel>
            <FormControl
              autoFocus
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <FormText className="text-muted">
              Please check your Email for the code.
            </FormText>
          </FormGroup>
          <LoaderButton
            block
            disabled={!validateForm()}
            type="submit"
            isLoading={isLoading}
            text="Verify Email"
            loadingText="Verifying Email…"
          />
        </form>
      )}
    </div>
  );
};

export default VerifyEmail;
