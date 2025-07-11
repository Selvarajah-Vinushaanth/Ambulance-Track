import React from 'react';
import styled from 'styled-components';

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8fafc;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #dc2626;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 20px;
  color: #64748b;
  font-size: 16px;
`;

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <SpinnerContainer>
      <div>
        <Spinner />
        <LoadingText>{message}</LoadingText>
      </div>
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
