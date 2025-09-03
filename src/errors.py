"""
Common error handling utilities for API responses.
Provides consistent error response formatting across the application.
"""

from typing import Dict, Any, Optional, Tuple, Union
from flask import jsonify

def api_error_response(
    message: str, 
    status_code: int = 500, 
    error_code: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> Tuple[Dict[str, Any], int]:
    """
    Create a standardized API error response.
    
    Args:
        message: Human-readable error message
        status_code: HTTP status code
        error_code: Optional application-specific error code
        details: Optional additional error details
        
    Returns:
        Tuple containing (response_dict, status_code)
    """
    response = {
        "success": False,
        "error": message,
    }
    
    if error_code:
        response["error_code"] = error_code
        
    if details:
        response["details"] = details
        
    return response, status_code
    
def api_success_response(
    data: Dict[str, Any], 
    message: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized API success response.
    
    Args:
        data: Response data
        message: Optional success message
        meta: Optional metadata about the response
        
    Returns:
        Response dictionary
    """
    response = {
        "success": True,
        "data": data
    }
    
    if message:
        response["message"] = message
    
    if meta:
        response["meta"] = meta
        
    return response
