"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import ImageUpload from "@/components/common/form/ImageUpload";
import InputField from "@/components/common/form/InputField";
import { Formik, Form } from "formik";
import { BasicInfoValidationSchema } from "@/utils/validationSchema";
import { BasicInfoFormValues } from "@/utils/types";
import Button from "../../Button";
import { useSelector, useDispatch } from "react-redux";
import {
  updateUserAPI,
  uploadProfileImageAPI,
} from "../../../../services/superAdminServices";

import BackButton from "../../BackButton";
import FormActionBar from "../../FormActionBar";

interface EditProfileProps {
  user: any;
  onBack: () => void;
}

export interface BasicInfoFormHandle {
  submitForm: () => void;
}

const EditProfile = forwardRef<BasicInfoFormHandle, EditProfileProps>(
  ({ user, onBack }, ref) => {
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const formikRef = useRef<any>(null);
    const dispatch = useDispatch();

    // Fetch profile data from Redux
    const profileData = useSelector((state: any) => state.global.profileData);
    const userId = user?.id || profileData?.result?.id; // Fallback to user prop or profileData

    // Initialize form values
    const initialValues: BasicInfoFormValues = {
      firstName: user?.firstName || profileData?.result?.firstName || "",
      lastName: user?.lastName || profileData?.result?.lastName || "",
      email: user?.email || profileData?.result?.email || "",
    };

    useImperativeHandle(ref, () => ({
      submitForm: () => {
        if (formikRef.current) {
          formikRef.current.handleSubmit();
        }
      },
    }));

    const handleSubmit = async (values: BasicInfoFormValues) => {
      try {
        // Update user profile using updateUserAPI
        const updateSuccess = await updateUserAPI(dispatch, userId, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
        });

        if (!updateSuccess) {
          console.error("Failed to update user profile");
          return;
        }

        // Upload profile image if selected
        if (profileImage) {
          const imageUploadSuccess = await uploadProfileImageAPI(
            dispatch,
            userId,
            profileImage
          );
          if (!imageUploadSuccess) {
            console.error("Failed to upload profile image");
            return;
          }
        }

        // Navigate back on success
        onBack();
      } catch (error) {
        console.error("Error during profile update:", error);
      }
    };

    return (
      <div className="w-full max-w-[630px] mx-auto p-6">
        <BackButton
          label="Profile Settings"
          onClick={onBack}
          iconPosition="left"
          className=""
        />
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={BasicInfoValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, isValid }) => (
            <Form>
              <div className="min-h-[585px]">
                <div className="pt-6 px-4 bg-g-background-100 sm:rounded-3xl rounded-2xl lg:rounded-[32px] border-(--genrel-light-stroke) border-[1px]">
                  <ImageUpload
                    onImageChange={(file) => setProfileImage(file)}
                    description="Upload your profile picture (max 4MB)"
                    initialImage={
                      user?.pictureUrl ||
                      profileData?.result?.pictureUrl ||
                      null
                    }
                    showDeleteButton={true}
                  />
                  <div className="grid gap-4 mt-4 py-6">
                    <InputField
                      name="firstName"
                      label="First Name *"
                      type="text"
                      placeholder="First name"
                    />
                    <InputField
                      name="lastName"
                      label="Last Name *"
                      type="text"
                      placeholder="Last name"
                    />
                    <InputField
                      name="email"
                      label="Email *"
                      type="email"
                      placeholder="Enter email"
                    />
                  </div>
                </div>
              </div>
              <FormActionBar onCancel={onBack} cancelLabel="Back">
                <Button
                  variant="filled"
                  label="Save"
                  isLoading={isSubmitting}
                  disabled={!isValid}
                  type="submit"
                />
              </FormActionBar>
            </Form>
          )}
        </Formik>
      </div>
    );
  }
);

EditProfile.displayName = "EditProfile";

export default EditProfile;
