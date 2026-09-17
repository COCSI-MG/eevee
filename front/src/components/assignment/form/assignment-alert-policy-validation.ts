import { CONFIGURABLE_ASSIGNMENT_ALERT_TYPES } from "@/app/interface/scheduler-api/assignment-alert";
import * as Yup from "yup";

export const assignmentAlertPolicyValidationSchema = Yup.object({
  suspensionAlertLimit: Yup.number()
    .integer("Informe um número inteiro")
    .min(1, "O limite deve ser no mínimo 1")
    .max(100, "O limite deve ser no máximo 100")
    .required("Informe o limite de alertas"),
  typingCharactersPerSecondLimit: Yup.number()
    .integer("Informe um número inteiro")
    .min(1, "A velocidade deve ser no mínimo 1")
    .max(1000, "A velocidade deve ser no máximo 1000")
    .required("Informe o limite de digitação"),
  punitiveTypes: Yup.array()
    .of(Yup.string().oneOf(CONFIGURABLE_ASSIGNMENT_ALERT_TYPES))
    .required(),
});
