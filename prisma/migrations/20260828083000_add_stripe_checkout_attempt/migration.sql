ALTER TABLE "Invoice"
ADD COLUMN "stripeCheckoutAttemptId" TEXT;

CREATE UNIQUE INDEX "Invoice_stripeCheckoutAttemptId_key"
ON "Invoice"("stripeCheckoutAttemptId");
