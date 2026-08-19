import midtransclient

from flask import current_app


def get_midtrans_client():

    return midtransclient.Snap(
        is_production=current_app.config[
            "MIDTRANS_IS_PRODUCTION"
        ],

        server_key=current_app.config[
            "MIDTRANS_SERVER_KEY"
        ]
    )


def create_snap_transaction(
    order_id,
    gross_amount,
    customer
):

    snap = get_midtrans_client()

    parameter = {
        "transaction_details": {
            "order_id": str(order_id),
            "gross_amount": int(gross_amount)
        },

        "credit_card": {
            "secure": True
        },

        "customer_details": {
            "first_name": customer.get(
                "first_name"
            ),

            "last_name": customer.get(
                "last_name"
            ),

            "email": customer.get(
                "email"
            ),

            "phone": customer.get(
                "phone"
            )
        }
    }

    transaction = snap.create_transaction(
        parameter
    )

    return transaction


def get_transaction_status(
    order_number
):

    snap = get_midtrans_client()

    return snap.transactions.status(
        order_number
    )


def refund_transaction(
    transaction_id,
    refund_key,
    amount,
    reason=None
):

    snap = get_midtrans_client()

    refund_parameter = {
        "refund_key": refund_key,

        "amount": int(amount),

        "reason": (
            reason
            or "Customer refund"
        )
    }

    refund = snap.transactions.refund(
        transaction_id,
        refund_parameter
    )

    return refund
