import { Button, Tooltip } from "antd";

export default function AdminIconButton({
    label,
    tooltip = label,
    icon,
    className = "",
    tooltipProps,
    ...buttonProps
}) {
    const classes = ["dp-admin-action-button", className].filter(Boolean).join(" ");

    return (
        <Tooltip title={tooltip} {...tooltipProps}>
            <Button
                type="text"
                icon={icon}
                aria-label={label}
                className={classes}
                {...buttonProps}
            />
        </Tooltip>
    );
}
