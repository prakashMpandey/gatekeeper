 class SuccessResponse {
    
    constructor(status=200,data,message="success")
    {
        this.status=status;
        this.data=data;
        this.message=message;
        this.success=status < 400 ? true : false
    }
}

class ErrorResponse extends Error{
    constructor(statusCode,message,errors=[],stack="")
    {

        super()
        this.message=message;
        this.errors=errors;
        this.statusCode=statusCode;

        if(stack)
        {
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }

}

export {ErrorResponse,SuccessResponse}
