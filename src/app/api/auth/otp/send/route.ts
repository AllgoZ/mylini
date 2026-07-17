import { OtpService } from '@/lib/services/otpService'
import { otpSendSchema } from '@/lib/validations/authSchema'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = otpSendSchema.parse(body)

    await OtpService.send(phone)

    return successResponse({ sent: true })
  } catch (error) {
    return errorResponse(error)
  }
}
