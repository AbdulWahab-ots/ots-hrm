"use client";

import React, { useEffect, useRef, useState } from "react";
import { Formik, Form, FormikValues } from "formik";
import InputField from "@/components/common/form/InputField";
import Button from "@/components/common/Button";
import { addNewRole, fetchRoleById, updateRoleById } from "@/services/adminServices";
import { useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { addNewRoleValidationSchema } from "@/utils/validationSchema";
import { toast } from "sonner";
import SelectField from "@/components/common/form/SelectField";

const AddRole: React.FC = () => {
    const [initialVals, setInitialVals] = useState<any>({ name: "", status: "" });
    const [roleDetails, setRoleDetails] = useState<any>(null);
    const router = useRouter();
    const dispatch = useDispatch();
    const params = useParams();
    const isFetchedRoleById = useRef(false);

    const handleEditRoleById = async (id: any) => {
        const response = await fetchRoleById(dispatch, id);
        if (response && response.name) {
            setInitialVals({
                name: response.result.name,
                status: response.result.active ? "active" : "in-active"
            });
            setRoleDetails(response.result);
        }
    }

    useEffect(() => {
        if (!isFetchedRoleById.current && params.id) {
            handleEditRoleById(params.id);
            isFetchedRoleById.current = true;
        } else {
            setInitialVals({ name: "", status: "" });
        }
    }, []);

    const handleSubmit = async (values: FormikValues) => {
        const payload = {
            name: values.name,
            active: values.status === "active" ? true : false,
            privilegeIds: []
        };

        try {
            let response;
            if (roleDetails) {
                response = await updateRoleById(dispatch, { role_id: roleDetails?.id, ...payload });
            } else {
                response = await addNewRole(dispatch, payload);
            }
            if (response && response.success) {
                router.push("/admin/users/roles");
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!!");
        }
    };

    return (
        <div className="rounded-[var(--g-radius-md)] p-6 bg-g-background-100 space-y-6 shadow-geist-card">
            <div>
                <h1 className="text-heading-24 text-g-gray-1000">{params.id ? "Update" : "Add"} Role</h1>
                <div className="border-b border-gray-200 w-full my-3"></div>
            </div>

            <Formik
                initialValues={initialVals}
                validationSchema={addNewRoleValidationSchema}
                enableReinitialize={true}
                onSubmit={handleSubmit}
            >
                {() => (
                    <Form className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <InputField
                                name="name"
                                label="Name"
                                type="text"
                                className="flex-1"
                            />
                            <SelectField
                                label="Status"
                                parentClassName="flex-1 flex gap-1 flex-col"
                                name="status"
                                options={[
                                    { value: "active", label: "Active" },
                                    { value: "in-active", label: "In-Active" }
                                ]}
                            />
                        </div>
                        <div className="flex flex-col gap-4 justify-center md:flex-row md:justify-end">
                            <button
                                type="button" onClick={() => router.push("/admin/users/roles")}
                                className="text-button-12 md:text-button-14 cursor-pointer px-6 py-2 border border-gray-300 rounded-[var(--g-radius-sm)] text-gray-700 bg-g-background-100 hover:bg-gray-50 transition-colors focus-ring-geist"
                            >
                                Cancel
                            </button>
                            <Button label={`${params.id ? "Update" : "Add"} Role`} type="submit" className="md:max-w-36"></Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default AddRole;