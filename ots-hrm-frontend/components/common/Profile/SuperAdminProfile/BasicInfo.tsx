"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
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

interface BasicInfoProps {
  onClose: () => void;
  onAddUserClick: () => void;
}

export interface BasicInfoFormHandle {
  submitForm: () => void;
}

const BasicInfo = forwardRef<BasicInfoFormHandle, BasicInfoProps>(
  ({ onClose, onAddUserClick }, ref) => {
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const formikRef = useRef<any>(null);
    const dispatch = useDispatch();

    // Fetch profile data
    const profileData = useSelector((state: any) => state.global.profileData);
    const Id = profileData?.result?.id; // Ensure userId is available
    const initialValues: BasicInfoFormValues = {
      firstName: profileData?.result?.firstName || "",
      lastName: profileData?.result?.lastName || "",
      email: profileData?.result?.email || "",
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
        // Update user profile
        const updateSuccess = await updateUserAPI(dispatch, Id, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
        });

        if (!updateSuccess) {
          console.error("Failed to update user profile");
          return;
        }

        // Upload profile image if one is selected
        if (profileImage) {
          const imageUploadSuccess = await uploadProfileImageAPI(
            dispatch,
            Id,
            profileImage
          );
          if (!imageUploadSuccess) {
            console.error("Failed to upload profile image");
            return;
          }
        }

        console.log("Form submission successful:", {
          ...values,
          profileImage: profileImage?.name || "No image selected",
        });

        // Close the form on success
        onClose();
      } catch (error) {
        console.error("Error during form submission:", error);
      }
    };

    return (
      <div className="flex flex-col">
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={BasicInfoValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, isValid }) => (
            <Form>
              <div className="min-h-[300px] 2xl:min-h-[500px]">
                <div className="pt-6 px-4 bg-g-background-100 sm:rounded-3xl rounded-2xl lg:rounded-[32px] border-(--genrel-light-stroke) border-[1px]">
                  <ImageUpload
                    onImageChange={(file) => setProfileImage(file)}
                    description="Upload your profile picture (max 4MB)"
                    initialImage={profileData?.result?.pictureUrl || null}
                  />
                  <div className="grid gap-4 md:grid-cols-2 mt-4 py-6">
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
              <div className="sm:rounded-3xl rounded-2xl lg:rounded-[32px] mt-4 bg-g-background-100 py-4 px-4 shadow-geist-card">
                <div className="flex justify-end items-center max-w-4xl mx-auto">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="text-(--primary-navy-blue) text-button-14 cursor-pointer hover:underline focus-ring-geist rounded-[var(--g-radius-sm)]"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <Button
                      variant="filled"
                      label="Save"
                      isLoading={isSubmitting}
                      disabled={!isValid}
                      type="submit"
                    />
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    );
  }
);

BasicInfo.displayName = "BasicInfo";

export default BasicInfo;
